'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import IPLLogo from '../ui/IPLLogo';
import Icon from '../ui/Icon';

type NavIconName = 'cricket' | 'stats' | 'news' | 'team' | 'target' | 'trophy';

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
    { href: '/', label: 'Home' },
    { href: '/matches', label: 'Schedule', icon: 'cricket' },
    { href: '/live-score', label: 'Live Score', icon: 'cricket' },
    { href: '/teams', label: 'Teams', icon: 'team' },
    { href: '/stats', label: 'Stats', icon: 'stats' },
    { href: '/news', label: 'News', icon: 'news' },
    { href: '/predictions', label: 'Predictions', icon: 'target' },
  ];

  const secondaryNavItems: NavItem[] = [
    { href: '/feed', label: 'For You', icon: 'stats' },
    { href: '/notifications', label: 'Notifications', icon: 'news' },
    { href: '/account', label: 'Account', icon: 'team' },
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
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled 
          ? 'bg-[rgba(13,16,27,0.7)] backdrop-blur-xl border-white/10 shadow-lg shadow-black/20' 
          : 'bg-[rgba(13,16,27,0.5)] backdrop-blur-md border-white/5'
      }`}
      style={{
        backdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'blur(10px) saturate(140%)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group relative">
            <div className="flex items-center justify-center transform group-hover:scale-110 transition-all duration-300">
              <IPLLogo size="md" animated />
            </div>
            <div className="flex flex-col -ml-1">
              <span className="text-white font-black text-2xl leading-none tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-ipl-blue-light group-hover:via-ipl-gold group-hover:to-ipl-blue-light transition-all duration-300">
                SportsUP18
              </span>
              <span className="text-ipl-gold text-sm font-bold tracking-widest">IPL 2026</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex flex-1 items-center justify-end gap-4">
            <div className="flex items-center space-x-1 bg-white/5 rounded-xl p-1 backdrop-blur-sm">
              {primaryNavItems.map((item) => {
                const isActive = isLinkActive(item.href);
                const badgeLabel = getNavBadgeLabel(item.href);
                const tooltip = getNavTooltip(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={tooltip || undefined}
                    className={`
                      relative px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2
                      ${isActive
                        ? 'text-white bg-gradient-to-r from-ipl-blue-dark to-ipl-purple shadow-lg shadow-ipl-purple/30'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'}
                    `}
                  >
                    {item.icon && <Icon name={item.icon} size={16} />}
                    <span className="flex items-center gap-1">
                      <span>{item.label}</span>
                      {badgeLabel && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-ipl-gold/15 text-ipl-gold border border-ipl-gold/40">
                          {badgeLabel}
                        </span>
                      )}
                    </span>
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-transparent via-ipl-gold to-transparent" />
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center space-x-2">
              {secondaryNavItems.map((item) => {
                const isActive = isLinkActive(item.href);
                const isPrimaryAction = item.href === '/feed';
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      relative flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold border transition-all duration-200
                      ${isPrimaryAction
                        ? isActive
                          ? 'bg-ipl-gold text-black border-ipl-gold shadow-lg shadow-ipl-gold/30'
                          : 'border-ipl-gold/60 text-ipl-gold hover:bg-ipl-gold/10 hover:border-ipl-gold'
                        : isActive
                          ? 'text-white border-ipl-gold bg-white/10 shadow-lg shadow-ipl-gold/20'
                          : 'text-gray-200 border-white/15 hover:text-white hover:border-ipl-gold/70 hover:bg-white/5'}
                    `}
                  >
                    {item.icon && <Icon name={item.icon} size={16} />}
                    <span className="hidden sm:inline">{item.label}</span>
                    <span className="sm:hidden">
                      {item.label === 'Notifications' ? 'Alerts' : item.label}
                    </span>
                    {item.href === '/notifications' && isActive && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-ipl-gold animate-ping" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all duration-200 relative group"
            >
              <svg
                className={`h-6 w-6 transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
              <div className="absolute inset-0 bg-gradient-to-r from-ipl-blue-light/20 to-ipl-purple/20 rounded-lg opacity-0 group-hover:opacity-100 blur transition-opacity duration-300 -z-10" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden animate-slide-up bg-[rgba(13,16,27,0.95)] backdrop-blur-xl border-t border-white/10">
          <div className="px-4 pt-2 pb-3 space-y-1">
            {allNavItems.map((item) => {
              const isActive = isLinkActive(item.href);
              const badgeLabel = getNavBadgeLabel(item.href);
              const tooltip = getNavTooltip(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={tooltip || undefined}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-base font-bold transition-all duration-200
                    ${isActive 
                      ? 'text-white bg-gradient-to-r from-ipl-blue-dark to-ipl-purple shadow-lg shadow-ipl-purple/20' 
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }
                  `}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.icon && <Icon name={item.icon} size={20} />}
                  <span className="flex items-center gap-2">
                    <span>{item.label}</span>
                    {badgeLabel && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-ipl-gold/15 text-ipl-gold border border-ipl-gold/40">
                        {badgeLabel}
                      </span>
                    )}
                  </span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-ipl-gold animate-glow" />
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
