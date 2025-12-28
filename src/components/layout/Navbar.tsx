'use client';

import Link from 'next/link';
import { useState, useEffect, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import SportsUP18LogoWithText from '../branding/SportsUP18LogoWithText';
import SportsUP18Logo from '../branding/SportsUP18Logo';
import Emoji from '../emoji/Emoji';
import LeagueSwitcher from './LeagueSwitcher';
import { useLeague } from '@/contexts/LeagueContext';

type NavEmojiName = 'cricket' | 'chart' | 'news' | 'glove' | 'target' | 'trophy' | 'sparkles' | 'people' | 'fire' | 'star' | 'cricket-bat' | 'lightning' | 'clock' | 'venue';

interface NavItem {
  href: string;
  label: string;
  emoji?: NavEmojiName;
}

export default function Navbar() {
  const { currentLeague } = useLeague();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPath, setLoadingPath] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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

  // Reorganized: Priority-based grouping
  // Group 1: Real-time & Core (Most Important)
  // Group 2: Explore & Discover
  // Group 3: Analytics & Insights
  // Generate league-aware navigation items
  const getLeagueAwareHref = (baseHref: string): string => {
    if (currentLeague === 'wpl' && baseHref !== '/') {
      // For WPL, use /wpl prefix for teams, matches, news
      if (baseHref === '/teams' || baseHref === '/matches' || baseHref === '/news') {
        return `/wpl${baseHref}`;
      }
    }
    return baseHref;
  };

  const primaryNavItems: NavItem[] = [
    // Real-time & Core Features (Highest Priority)
    { href: '/live-score', label: 'Live Score', emoji: 'lightning' },
    { href: getLeagueAwareHref('/matches'), label: 'Matches', emoji: 'cricket-bat' },
    // Explore & Discover
    { href: getLeagueAwareHref('/teams'), label: 'Teams', emoji: 'trophy' },
    { href: getLeagueAwareHref('/news'), label: 'News', emoji: 'fire' },
    // New Pages
    { href: '/matchday', label: 'Match Day', emoji: 'venue' },
    // Fan Stories temporarily hidden from end-user navigation
    // { href: '/stories', label: 'Fan Stories', emoji: 'people' },
    // Analytics & Insights (only for IPL, not WPL)
    ...(currentLeague !== 'wpl' ? [{ href: '/stats', label: 'Stats', emoji: 'chart' as NavEmojiName }] : []),
    // Predictions temporarily removed - will be added back when improved
    // { href: '/predictions', label: 'Predictions', emoji: 'target' },
  ];

  const secondaryNavItems: NavItem[] = [
    { href: '/notifications', label: 'Notifications', emoji: 'sparkles' },
    { href: '/account', label: 'Account', emoji: 'people' },
  ];

  const allNavItems = [...primaryNavItems, ...secondaryNavItems];

  const getNavBadgeLabel = (href: string): string | null => {
    if (href === '/stats') return 'Numbers';
    // Predictions temporarily removed
    // if (href === '/predictions') return 'AI Picks';
    return null;
  };

  const getNavTooltip = (href: string): string | null => {
    if (href === '/stats') return 'Leaderboards, records, and team comparisons';
    // Predictions temporarily removed
    // if (href === '/predictions')
    //   return 'AI-powered match win chances & toss insights';
    return null;
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle navigation with loading state
  const handleNavigation = (href: string) => {
    if (href === pathname) return;
    
    setLoadingPath(href);
    setIsLoading(true);
    
    startTransition(() => {
      router.push(href);
      setTimeout(() => {
        setIsLoading(false);
        setLoadingPath(null);
      }, 300);
    });
  };

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
          <div className="hidden md:flex flex-1 items-center justify-end gap-4 ml-8">
            {/* League Switcher */}
            <LeagueSwitcher />
            
            {/* Primary Nav - Reorganized with visual grouping */}
            <div className="flex items-center gap-2">
              {/* Group 1: Real-time & Core (Highlighted) */}
              <motion.div 
                className="flex items-center space-x-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-1.5 backdrop-blur-md border border-blue-500/30 shadow-lg shadow-blue-500/10"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                {primaryNavItems.slice(0, 2).map((item, index) => {
                  const isActive = isLinkActive(item.href);
                  const isLoading = loadingPath === item.href;
                  const isHovered = hoveredItem === item.href;
                  const tooltip = getNavTooltip(item.href);
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      onHoverStart={() => setHoveredItem(item.href)}
                      onHoverEnd={() => setHoveredItem(null)}
                    >
                      <Link
                        href={item.href}
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavigation(item.href);
                        }}
                        title={tooltip || undefined}
                        className={`
                          relative px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap overflow-hidden group
                          ${isActive
                            ? 'text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 shadow-lg shadow-blue-500/50 border border-blue-400/30'
                            : 'text-white/90 hover:text-white hover:bg-white/15 hover:border border-transparent hover:border-blue-400/40'}
                        `}
                      >
                        {/* Ripple effect on hover */}
                        {isHovered && !isActive && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.5, opacity: 0 }}
                            transition={{ duration: 0.4 }}
                          />
                        )}
                        
                        {/* Loading spinner */}
                        {isLoading && (
                          <motion.div
                            className="absolute inset-0 flex items-center justify-center bg-blue-500/20"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <motion.div
                              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                            />
                          </motion.div>
                        )}
                        
                        <span className="relative z-10 flex items-center gap-2">
                          {item.emoji && (
                            <motion.span
                              animate={isHovered ? { rotate: [0, -10, 10, -10, 0] } : {}}
                              transition={{ duration: 0.5 }}
                            >
                              <Emoji name={item.emoji} size={16} animate={true} />
                            </motion.span>
                          )}
                          <span>{item.label}</span>
                        </span>
                        
                        {/* Active indicator with glow */}
                        {isActive && (
                          <motion.div
                            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}
                        
                        {/* Hover glow effect */}
                        {isHovered && !isActive && (
                          <motion.div
                            className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Group 2 & 3: Explore & Analytics (Standard styling) */}
              <motion.div
                className="flex items-center space-x-1 bg-gradient-to-r from-white/8 to-white/5 rounded-xl p-1.5 backdrop-blur-md border border-white/15 hover:border-blue-500/40 hover:bg-gradient-to-r hover:from-white/12 hover:to-white/8 transition-all duration-300 shadow-lg shadow-black/20"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                {primaryNavItems.slice(2).map((item, index) => {
                const isActive = isLinkActive(item.href);
                  const isLoading = loadingPath === item.href;
                  const isHovered = hoveredItem === item.href;
                const badgeLabel = getNavBadgeLabel(item.href);
                const tooltip = getNavTooltip(item.href);
                return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onHoverStart={() => setHoveredItem(item.href)}
                      onHoverEnd={() => setHoveredItem(null)}
                    >
                  <Link
                    href={item.href}
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavigation(item.href);
                        }}
                    title={tooltip || undefined}
                    className={`
                          relative px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 whitespace-nowrap overflow-hidden group
                      ${isActive
                        ? 'text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 shadow-lg shadow-blue-500/50 border border-blue-400/30'
                        : 'text-gray-300 hover:text-white hover:bg-white/10 hover:border border-transparent hover:border-blue-500/30'}
                    `}
                  >
                        {/* Ripple effect */}
                        {isHovered && !isActive && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.5, opacity: 0 }}
                            transition={{ duration: 0.4 }}
                          />
                        )}
                        
                        {/* Loading spinner */}
                        {isLoading && (
                          <motion.div
                            className="absolute inset-0 flex items-center justify-center bg-blue-500/20"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <motion.div
                              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                            />
                          </motion.div>
                        )}
                        
                        <span className="relative z-10 flex items-center gap-1.5">
                          {item.emoji && (
                            <motion.span
                              animate={isHovered ? { rotate: [0, -10, 10, 0] } : {}}
                              transition={{ duration: 0.4 }}
                            >
                              <Emoji name={item.emoji} size={16} animate={true} />
                            </motion.span>
                          )}
                      <span>{item.label}</span>
                      {badgeLabel && (
                            <motion.span
                              className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-500/50 font-medium"
                              whileHover={{ scale: 1.1 }}
                            >
                          {badgeLabel}
                            </motion.span>
                          )}
                        </span>
                        
                        {/* Active indicator */}
                    {isActive && (
                          <motion.div
                            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                    )}
                  </Link>
                    </motion.div>
                );
              })}
              </motion.div>
            </div>

            {/* Secondary Nav Icons */}
            <motion.div
              className="flex items-center gap-3 pl-4 border-l border-white/15 pointer-events-auto"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {secondaryNavItems.map((item, index) => {
                const isActive = isLinkActive(item.href);
                const isLoading = loadingPath === item.href;
                const isHovered = hoveredItem === item.href;
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    onHoverStart={() => setHoveredItem(item.href)}
                    onHoverEnd={() => setHoveredItem(null)}
                  >
                    <Link
                    href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigation(item.href);
                      }}
                    aria-label={item.label}
                    className={`
                        relative flex items-center justify-center w-11 h-11 rounded-lg transition-all duration-300 cursor-pointer pointer-events-auto overflow-hidden
                      ${isActive
                        ? 'text-white bg-gradient-to-br from-blue-500/40 to-blue-600/40 border border-blue-400/60 shadow-lg shadow-blue-500/30'
                        : 'text-gray-300 border border-white/15 hover:text-white hover:border-blue-500/50 hover:bg-white/8 hover:shadow-lg hover:shadow-blue-500/10'}
                    `}
                  >
                      {/* Hover glow */}
                      {isHovered && !isActive && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        />
                      )}
                      
                      {/* Loading spinner */}
                      {isLoading && (
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center bg-blue-500/20 rounded-lg"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <motion.div
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                          />
                        </motion.div>
                      )}
                      
                      <span className="relative z-10">
                        {item.emoji && (
                          <motion.span
                            animate={isHovered ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            <Emoji name={item.emoji} size={18} animate={true} className="pointer-events-none" />
                          </motion.span>
                        )}
                      </span>
                      
                    {item.href === '/notifications' && (
                        <motion.span
                          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 shadow-lg shadow-red-500/50 pointer-events-none"
                          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                    )}
                  </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Mobile menu button */}
          <motion.div className="md:hidden ml-auto">
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-200 hover:text-white p-2.5 rounded-lg hover:bg-white/10 transition-all duration-300 relative"
              aria-label="Toggle menu"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                animate={{ rotate: isMenuOpen ? 90 : 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <AnimatePresence mode="wait">
                {isMenuOpen ? (
                    <motion.path
                      key="close"
                      initial={{ opacity: 0, pathLength: 0 }}
                      animate={{ opacity: 1, pathLength: 1 }}
                      exit={{ opacity: 0, pathLength: 0 }}
                      transition={{ duration: 0.2 }}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <motion.path
                      key="menu"
                      initial={{ opacity: 0, pathLength: 0 }}
                      animate={{ opacity: 1, pathLength: 1 }}
                      exit={{ opacity: 0, pathLength: 0 }}
                      transition={{ duration: 0.2 }}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </AnimatePresence>
              </motion.svg>
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
      {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden bg-[rgba(10,14,39,0.95)] backdrop-blur-2xl border-t border-blue-500/20"
          >
            <div className="px-4 pt-4 pb-4 space-y-4">
              {/* League Switcher for Mobile */}
              <div className="flex justify-center pb-2 border-b border-white/10">
                <LeagueSwitcher />
              </div>
            {/* Group 1: Real-time & Core (Highlighted) */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <div className="px-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                Core Features
              </div>
              {primaryNavItems.slice(0, 2).map((item, index) => {
                const isActive = isLinkActive(item.href);
                const isLoading = loadingPath === item.href;
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + index * 0.1, duration: 0.3 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigation(item.href);
                        setTimeout(() => setIsMenuOpen(false), 200);
                      }}
                      className={`
                        relative flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-bold transition-all duration-300 overflow-hidden
                        ${isActive 
                          ? 'text-white bg-gradient-to-r from-blue-500/50 to-cyan-500/50 shadow-lg shadow-blue-500/30 border border-blue-400/50' 
                          : 'text-white/90 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/30 active:scale-95'}
                      `}
                    >
                      {isLoading && (
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center bg-blue-500/30"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <motion.div
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                          />
                        </motion.div>
                      )}
                      <span className="relative z-10 flex items-center gap-3 flex-1">
                        {item.emoji && <Emoji name={item.emoji} size={22} animate={true} />}
                        <span className="flex-1">{item.label}</span>
                      </span>
                      {isActive && (
                        <motion.div
                          className="w-2.5 h-2.5 rounded-full bg-blue-400"
                          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Group 2: Explore & Discover */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <div className="px-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Explore
              </div>
              {primaryNavItems.slice(2, 4).map((item, index) => {
                const isActive = isLinkActive(item.href);
                const isLoading = loadingPath === item.href;
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + index * 0.1, duration: 0.3 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigation(item.href);
                        setTimeout(() => setIsMenuOpen(false), 200);
                      }}
                      className={`
                        relative flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold transition-all duration-300 overflow-hidden
                        ${isActive 
                          ? 'text-white bg-gradient-to-r from-blue-500/40 to-blue-600/40 shadow-lg shadow-blue-500/20 border border-blue-500/40' 
                          : 'text-gray-200 hover:text-white hover:bg-white/8 active:scale-95'}
                      `}
                    >
                      {isLoading && (
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center bg-blue-500/20"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <motion.div
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                          />
                        </motion.div>
                      )}
                      <span className="relative z-10 flex items-center gap-3 flex-1">
                        {item.emoji && <Emoji name={item.emoji} size={20} animate={true} />}
                        <span className="flex-1">{item.label}</span>
                      </span>
                      {isActive && (
                        <motion.div
                          className="w-2.5 h-2.5 rounded-full bg-blue-400"
                          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Group 3: Analytics & Insights */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <div className="px-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Analytics
              </div>
              {primaryNavItems.slice(4).map((item, index) => {
              const isActive = isLinkActive(item.href);
                const isLoading = loadingPath === item.href;
              const badgeLabel = getNavBadgeLabel(item.href);
              return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + index * 0.1, duration: 0.3 }}
                    whileTap={{ scale: 0.98 }}
                  >
                <Link
                  href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigation(item.href);
                        setTimeout(() => setIsMenuOpen(false), 200);
                      }}
                  className={`
                        relative flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold transition-all duration-300 overflow-hidden
                    ${isActive 
                      ? 'text-white bg-gradient-to-r from-blue-500/40 to-blue-600/40 shadow-lg shadow-blue-500/20 border border-blue-500/40' 
                          : 'text-gray-200 hover:text-white hover:bg-white/8 active:scale-95'}
                      `}
                    >
                      {isLoading && (
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center bg-blue-500/20"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <motion.div
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                          />
                        </motion.div>
                      )}
                      <span className="relative z-10 flex items-center gap-2 flex-1">
                  {item.emoji && <Emoji name={item.emoji} size={20} animate={true} />}
                        <span className="flex-1">{item.label}</span>
                    {badgeLabel && (
                          <motion.span
                            className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-500/50 font-medium"
                            whileHover={{ scale: 1.1 }}
                          >
                        {badgeLabel}
                          </motion.span>
                        )}
                      </span>
                      {isActive && (
                        <motion.div
                          className="w-2.5 h-2.5 rounded-full bg-blue-400"
                          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Secondary Nav Items */}
            <motion.div
              className="pt-2 border-t border-white/10 space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.3 }}
            >
              {secondaryNavItems.map((item, index) => {
                const isActive = isLinkActive(item.href);
                const isLoading = loadingPath === item.href;
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.75 + index * 0.1, duration: 0.3 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigation(item.href);
                        setTimeout(() => setIsMenuOpen(false), 200);
                      }}
                      className={`
                        relative flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold transition-all duration-300 overflow-hidden
                        ${isActive 
                          ? 'text-white bg-gradient-to-r from-blue-500/40 to-blue-600/40 shadow-lg shadow-blue-500/20 border border-blue-500/40' 
                          : 'text-gray-200 hover:text-white hover:bg-white/8 active:scale-95'}
                      `}
                    >
                      {isLoading && (
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center bg-blue-500/20"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <motion.div
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                          />
                        </motion.div>
                      )}
                      <span className="relative z-10 flex items-center gap-3 flex-1">
                        {item.emoji && <Emoji name={item.emoji} size={20} animate={true} />}
                        <span className="flex-1">{item.label}</span>
                  </span>
                      {item.href === '/notifications' && (
                        <motion.span
                          className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-lg shadow-red-500/50"
                          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                  {isActive && (
                        <motion.div
                          className="w-2.5 h-2.5 rounded-full bg-blue-400"
                          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                  )}
                </Link>
                  </motion.div>
              );
            })}
            </motion.div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </nav>
  );
}
