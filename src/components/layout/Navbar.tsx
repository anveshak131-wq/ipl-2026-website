'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import IPLLogo from '../ui/IPLLogo';
import Icon from '../ui/Icon';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: null },
    { href: '/matches', label: 'Schedule', icon: 'cricket' as const },
    { href: '/live-score', label: 'Live Score', icon: 'cricket' as const },
    { href: '/teams', label: 'Teams', icon: 'team' as const },
    { href: '/players', label: 'Players', icon: 'team' as const },
    { href: '/news', label: 'News', icon: 'news' as const },
    { href: '/predictions', label: 'Predictions', icon: 'target' as const },
  ];

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
              <IPLLogo size="md" animated={false} />
            </div>
            <div className="flex flex-col -ml-1">
              <span className="text-white font-black text-2xl leading-none tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-ipl-blue-light group-hover:via-ipl-gold group-hover:to-ipl-blue-light transition-all duration-300">
                IPL
              </span>
              <span className="text-ipl-gold text-sm font-bold tracking-widest">2026</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-1 bg-white/5 rounded-xl p-1 backdrop-blur-sm">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      relative px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2
                      ${isActive 
                        ? 'text-white bg-gradient-to-r from-ipl-blue-dark to-ipl-purple shadow-lg shadow-ipl-purple/30' 
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }
                    `}
                  >
                    {item.icon && <Icon name={item.icon} size={16} />}
                    {item.label}
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-transparent via-ipl-gold to-transparent" />
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
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
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
                  {item.label}
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
