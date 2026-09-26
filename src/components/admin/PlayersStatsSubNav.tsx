'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { TrendingDown, TrendingUp, Users } from 'lucide-react';

const adminStatsLinks = [
  {
    href: '/ipl-admin-2026/players?view=players',
    label: 'Players',
    Icon: Users,
    activeColor: 'border-[#d7a85b]/45 bg-[#d7a85b]/20 text-white shadow-[0_10px_28px_rgba(215,168,91,0.16)]',
    iconColor: 'text-[#f2d39a]'
  },
  {
    href: '/ipl-admin-2026/players?view=batting',
    label: 'Batting Stats',
    Icon: TrendingUp,
    activeColor: 'border-[#4cc39a]/45 bg-[#4cc39a]/20 text-white shadow-[0_10px_28px_rgba(76,195,154,0.16)]',
    iconColor: 'text-[#9cf2c8]'
  },
  {
    href: '/ipl-admin-2026/players?view=bowling',
    label: 'Bowling Stats',
    Icon: TrendingDown,
    activeColor: 'border-[#4fb6c4]/45 bg-[#4fb6c4]/20 text-white shadow-[0_10px_28px_rgba(79,182,196,0.16)]',
    iconColor: 'text-[#a8e9ef]'
  }
];

export default function PlayersStatsSubNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') || 'players';

  return (
    <nav
      aria-label="Players and stats admin pages"
      className="sticky top-0 z-40 mb-6 rounded-2xl border border-white/10 bg-[#07110f]/88 p-2 shadow-2xl shadow-black/20 backdrop-blur-xl"
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {adminStatsLinks.map(({ href, label, Icon, activeColor, iconColor }) => {
          const hrefView = new URLSearchParams(href.split('?')[1]).get('view') || 'players';
          const isActive = pathname === '/ipl-admin-2026/players' && currentView === hrefView;

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                isActive
                  ? activeColor
                  : 'border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? iconColor : 'text-white/42'}`} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
