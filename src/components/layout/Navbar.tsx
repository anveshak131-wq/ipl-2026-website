'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import SportsUP18LogoWithText from '../branding/SportsUP18LogoWithText';
import SportsUP18Logo from '../branding/SportsUP18Logo';
import Emoji from '../emoji/Emoji';

type NavEmojiName = 'cricket' | 'chart' | 'news' | 'glove' | 'target' | 'trophy' | 'sparkles' | 'people' | 'fire' | 'star' | 'cricket-bat' | 'lightning' | 'clock' | 'venue';

interface NavItem {
  href: string;
  label: string;
  emoji?: NavEmojiName;
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const [motionEnabled, setMotionEnabled] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sportsup_motion');
      if (stored !== null) {
        setMotionEnabled(stored === '1');
      } else {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        setMotionEnabled(!prefersReduced);
      }
    } catch (e) {
      setMotionEnabled(true);
    }
  }, []);

  const isLinkActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const primaryNavItems: NavItem[] = [
    { href: '/live-score', label: 'Live Score', emoji: 'lightning' },
    { href: '/matches', label: 'Matches', emoji: 'cricket-bat' },
    { href: '/teams', label: 'Teams', emoji: 'trophy' },
    { href: '/stats', label: 'Stats', emoji: 'chart' },
    { href: '/predictions', label: 'Predictions', emoji: 'target' },
    { href: '/news', label: 'News', emoji: 'fire' },
  ];

  const secondaryNavItems: NavItem[] = [
    { href: '/notifications', label: 'Notifications', emoji: 'sparkles' },
    { href: '/account', label: 'Account', emoji: 'people' },
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
          ? 'bg-[rgba(10,14,39,0.95)] backdrop-blur-3xl border-blue-500/30 shadow-2xl shadow-black/50' 
          : 'bg-[rgba(10,14,39,0.7)] backdrop-blur-2xl border-blue-500/20'
      }`}
      style={{
        backdropFilter: scrolled ? 'blur(25px) saturate(220%)' : 'blur(20px) saturate(180%)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo Section - New SportsUP18 Logo */}
          <div className="flex items-center gap-2 md:gap-4">
            <Link 
              href="/" 
              className="flex items-center group relative shrink-0 hover:opacity-90 transition-opacity duration-300"
            >
              {/* Mobile: Icon only */}
              <div className="md:hidden">
                <SportsUP18Logo 
                  size="lg" 
                  animated={motionEnabled}
                  className="drop-shadow-lg"
                />
              </div>
              
              {/* Desktop: Logo with text - Larger size */}
              <div className="hidden md:flex">
                <SportsUP18LogoWithText 
                  size="xl" 
                  animated={motionEnabled}
                  className="drop-shadow-lg hover:drop-shadow-2xl transition-all duration-300"
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex flex-1 items-center justify-end gap-6 ml-8">
            {/* Primary Nav */}
            <div className="flex items-center space-x-1 bg-gradient-to-r from-white/8 to-white/5 rounded-xl p-1.5 backdrop-blur-md border border-white/15 hover:border-blue-500/40 hover:bg-gradient-to-r hover:from-white/12 hover:to-white/8 transition-all duration-300 shadow-lg shadow-black/20">
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
                      relative px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 whitespace-nowrap
                      ${isActive
                        ? 'text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 shadow-lg shadow-blue-500/50 border border-blue-400/30'
                        : 'text-gray-300 hover:text-white hover:bg-white/10 hover:border border-transparent hover:border-blue-500/30'}
                    `}
                  >
                    {item.emoji && <Emoji name={item.emoji} size={16} animate={true} />}
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
            <div className="flex items-center gap-3 pl-4 border-l border-white/15 pointer-events-auto">
              {secondaryNavItems.map((item) => {
                const isActive = isLinkActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.label}
                    className={`
                      relative flex items-center justify-center w-11 h-11 rounded-lg transition-all duration-300 cursor-pointer pointer-events-auto
                      ${isActive
                        ? 'text-white bg-gradient-to-br from-blue-500/40 to-blue-600/40 border border-blue-400/60 shadow-lg shadow-blue-500/30'
                        : 'text-gray-300 border border-white/15 hover:text-white hover:border-blue-500/50 hover:bg-white/8 hover:shadow-lg hover:shadow-blue-500/10'}
                    `}
                  >
                    {item.emoji && <Emoji name={item.emoji} size={18} animate={true} className="pointer-events-none" />}
                    {item.href === '/notifications' && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50 pointer-events-none" />
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
                  {item.emoji && <Emoji name={item.emoji} size={20} animate={true} />}
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
