'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import IPLLogo from '../ui/IPLLogo';
import { Search, X, Users } from 'lucide-react';

interface PlayersAdminSidebarProps {
  currentPage?: string;
  onLogout?: () => void;
}

export default function PlayersAdminSidebar({ currentPage = '', onLogout }: PlayersAdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminName, setAdminName] = useState('Players Admin');
  const [adminEmail, setAdminEmail] = useState('admin@ipl2026.com');
  const [searchQuery, setSearchQuery] = useState('');

  // Load admin details
  useEffect(() => {
    const loadAdmin = async () => {
      try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('adminToken');
        if (!token) return;

        const res = await fetch(`/api/auth?action=verify&token=${token}`);
        const data = await res.json();
        if (!res.ok || !data.success || !data.user) return;

        const user = data.user;
        const name = user.name || user.username || 'Players Admin';
        const email = user.email || adminEmail;

        setAdminName(name);
        setAdminEmail(email);
      } catch (err) {
        console.error('Error loading admin details:', err);
      }
    };

    loadAdmin();
  }, []);

  // Players-only navigation items
  const menuItems = [
    {
      href: '/ipl-admin-2026/players',
      label: 'Players',
      icon: <Users className="w-5 h-5" />,
      shortcut: 'P',
    },
  ];

  // Filter menu items based on search
  const filteredMenuItems = menuItems.filter(
    (item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.href.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNavigation = (href: string) => {
    router.push(href);
    if (window.innerWidth < 768) {
      setMobileOpen(false);
    }
    setSearchQuery('');
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }

    try {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('authToken');
    } catch {
      // localStorage not available
    }
    router.push('/ipl-admin-2026');
  };

  const adminInitials = adminName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'PA';

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-16' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className={`p-4 border-b border-gray-800 ${collapsed ? 'px-3' : ''}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="relative flex items-center justify-center">
              <IPLLogo size="sm" animated />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm leading-tight">SportsUP18</span>
                <span className="text-gray-400 text-xs">Players Admin</span>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        {!collapsed && (
          <div className="p-4 border-b border-gray-800">
            <label
              htmlFor="sidebar-search"
              className="block text-sm font-medium sr-only"
            >
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="sidebar-search"
                name="sidebar-search"
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {filteredMenuItems.map((item) => {
            const isActive =
              currentPage === item.href ||
              (!!currentPage && currentPage.startsWith(item.href + '/'));

            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={`
                  w-full group relative flex items-center
                  ${collapsed ? 'justify-center px-2' : 'space-x-3 px-3'}
                  py-2.5 rounded-lg transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }
                `}
                title={collapsed ? item.label : undefined}
              >
                {isActive && !collapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                )}
                <span className={`relative flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'} transition-colors`}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left font-medium">{item.label}</span>
                    {item.shortcut && (
                      <span className="text-xs text-gray-400 opacity-50">
                        {item.shortcut}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className={`p-4 border-t border-gray-800 ${collapsed ? 'px-3' : ''}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {adminInitials}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">{adminName}</div>
                <div className="text-gray-400 text-xs truncate">{adminEmail}</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="mt-3 w-full py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
            >
              Logout
            </button>
          )}
        </div>

        {/* Collapse Toggle */}
        <div className={`p-2 border-t border-gray-800 ${collapsed ? 'px-2' : ''}`}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full py-2 text-gray-400 hover:text-gray-300 transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {collapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
