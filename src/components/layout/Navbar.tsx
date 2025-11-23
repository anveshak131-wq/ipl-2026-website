'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import IPLLogo from '../ui/IPLLogo';
import Icon from '../ui/Icon';

type NavIconName = 'cricket' | 'stats' | 'news' | 'team' | 'target' | 'trophy' | 'bell' | 'user';

interface NavItem {
  href: string;
  label: string;
  icon?: NavIconName;
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const primaryNavItems: NavItem[] = [
    { href: '/live-score', label: 'Live Score', icon: 'cricket' },
    { href: '/matches', label: 'Matches', icon: 'cricket' },
    { href: '/teams', label: 'Teams', icon: 'team' },
    { href: '/stats', label: 'Stats', icon: 'stats' },
    { href: '/predictions', label: 'Predictions', icon: 'target' },
    { href: '/news', label: 'News', icon: 'news' },
  ];

  const secondaryNavItems: NavItem[] = [
    { href: '/notifications', label: 'Notifications', icon: 'bell' },
    { href: '/account', label: 'Account', icon: 'user' },
  ];

  const allNavItems = [...primaryNavItems, ...secondaryNavItems];

  const getNavBadgeLabel = (href: string): string | null => {
    if (href === '/stats') return 'Numbers';
    if (href === '/predictions') return 'AI Picks';
    return null;
  };

  const getNavTooltip = (href: string): string | null => {
    if (href === '/stats') return 'Leaderboards, records, and team comparisons';
    if (href === '/predictions')
      return 'AI-powered match win chances & toss insights';
    return null;
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`sticky top-0 z-50 border-b transition-all duration-500 ${
        scrolled 
          ? 'bg-[rgba(10,14,39,0.8)] backdrop-blur-2xl border-blue-500/20 shadow-2xl shadow-black/40' 
          : 'bg-[rgba(10,14,39,0.6)] backdrop-blur-xl border-blue-500/10'
      }`}
      style={{
        backdropFilter: scrolled ? 'blur(20px) saturate(200%)' : 'blur(15px) saturate(150%)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo Section */}
          <Link href="/" className="flex items-center space-x-3 group relative shrink-0">
            <div className="flex items-center justify-center transform group-hover:scale-115 transition-transform duration-400 ease-out">
              <IPLLogo size="md" animated />
            </div>
            <div className="flex flex-col -ml-1">
              <span className="text-white font-bold text-xl md:text-2xl leading-none tracking-tight transition-all duration-300">
                SportsUP18
              </span>
              <span className="text-blue-400 text-xs md:text-sm font-semibold tracking-widest transition-colors duration-300 group-hover:text-cyan-300">
                IPL 2026
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex flex-1 items-center justify-end gap-6 ml-8">
            {/* Primary Nav */}
            <div className="flex items-center space-x-1 bg-white/5 rounded-xl p-1.5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-colors duration-300">
              {primaryNavItems.map((item, index) => {
                const isActive = isLinkActive(item.href);
                const badgeLabel = getNavBadgeLabel(item.href);
                const tooltip = getNavTooltip(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={tooltip || undefined}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className={`
                      relative px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2
                      ${isActive
                        ? 'text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/40'
                        : 'text-gray-200 hover:text-white hover:bg-white/8'}
                    `}
                  >
                    {item.icon && <Icon name={item.icon} size={16} />}
                    <span className="flex items-center gap-1.5">
                      <span>{item.label}</span>
                      {badgeLabel && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-500/50 font-medium">
                          {badgeLabel}
                        </span>
                      )}
                    </span>
                    {isActive && (
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Secondary Nav Icons */}
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              {secondaryNavItems.map((item) => {
                const isActive = isLinkActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.label}
                    className={`
                      relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300
                      ${isActive
                        ? 'text-white bg-blue-500/30 border border-blue-400/60 shadow-lg shadow-blue-500/20'
                        : 'text-gray-200 border border-white/10 hover:text-white hover:border-blue-500/50 hover:bg-white/5'}
                    `}
                  >
                    {item.icon && <Icon name={item.icon} size={18} />}
                    {item.href === '/notifications' && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden ml-auto">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-200 hover:text-white p-2.5 rounded-lg hover:bg-white/10 transition-all duration-300 relative"
              aria-label="Toggle menu"
            >
              <svg
                className={`h-6 w-6 transition-transform duration-500 ${isMenuOpen ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden animate-slide-in-down bg-[rgba(10,14,39,0.95)] backdrop-blur-2xl border-t border-blue-500/20">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {allNavItems.map((item, index) => {
              const isActive = isLinkActive(item.href);
              const badgeLabel = getNavBadgeLabel(item.href);
              const tooltip = getNavTooltip(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={tooltip || undefined}
                  style={{ animationDelay: `${index * 30}ms` }}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold transition-all duration-300 animate-fade-in-up
                    ${isActive 
                      ? 'text-white bg-gradient-to-r from-blue-500/40 to-blue-600/40 shadow-lg shadow-blue-500/20 border border-blue-500/40' 
                      : 'text-gray-200 hover:text-white hover:bg-white/8'}
                  `}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.icon && <Icon name={item.icon} size={20} />}
                  <span className="flex items-center gap-2 flex-1">
                    <span>{item.label}</span>
                    {badgeLabel && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-500/50 font-medium">
                        {badgeLabel}
                      </span>
                    )}
                  </span>
                  {isActive && (
                    <div className="ml-auto w-2.5 h-2.5 rounded-full bg-blue-400 animate-glow" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
