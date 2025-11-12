'use client';

import { useRouter } from 'next/navigation';

interface AdminSidebarProps {
  currentPage: string;
}

export default function AdminSidebar({ currentPage }: AdminSidebarProps) {
  const router = useRouter();

  const menuItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/matches', label: 'Manage Matches', icon: '🏏' },
    { href: '/admin/teams', label: 'Manage Teams', icon: '👥' },
    { href: '/admin/players', label: 'Manage Players', icon: '🏃' },
    { href: '/admin/content', label: 'Manage Content', icon: '📝' },
    { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin');
  };

  return (
    <div className="w-64 bg-ipl-dark border-r border-white/10 min-h-screen">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-10 h-10 bg-gradient-to-r from-ipl-purple to-ipl-gold rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">IPL</span>
          </div>
          <span className="text-white font-bold text-lg">Admin</span>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                currentPage === item.href
                  ? 'bg-gradient-to-r from-ipl-purple to-ipl-gold text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-8 pt-8 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
