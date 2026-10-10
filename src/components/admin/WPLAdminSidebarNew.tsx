'use client';

import { useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import AdminLeagueSwitcher from './AdminLeagueSwitcher';
import {
  Home,
  Calendar,
  MapPin,
  FileText,
  Target,
  Activity,
  Users,
  Shield,
  BarChart3,
  TrendingUp,
  Award,
  Settings,
  Search,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Radio,
} from 'lucide-react';

interface MenuItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  group: string;
}

const menuItems: MenuItem[] = [
  { href: '/ops/wpl/dashboard', label: 'Dashboard', icon: <Home className="w-4 h-4" />, group: 'Overview' },
  { href: '/ops/wpl/statistics', label: 'Statistics', icon: <Award className="w-4 h-4" />, group: 'Overview' },
  { href: '/ops/wpl/analytics', label: 'Analytics', icon: <TrendingUp className="w-4 h-4" />, group: 'Overview' },

  { href: '/ops/wpl/matches', label: 'Matches & Fixtures', icon: <Calendar className="w-4 h-4" />, group: 'Live Ops' },
  { href: '/ops/wpl/fixtures/wpl-2027-m01/lineups', label: 'Toss & Lineups', icon: <ShieldCheck className="w-4 h-4" />, group: 'Live Ops' },
  { href: '/ops/wpl/points-table', label: 'Points Table', icon: <BarChart3 className="w-4 h-4" />, group: 'Live Ops' },
  { href: '/ops/wpl/live-score-ai', label: 'Live Score AI', icon: <Radio className="w-4 h-4" />, group: 'Live Ops' },
  { href: '/ops/wpl/live-score-csv', label: 'Live Score CSV', icon: <FileText className="w-4 h-4" />, group: 'Live Ops' },
  { href: '/ops/wpl/playing-11', label: 'Playing 11', icon: <Users className="w-4 h-4" />, group: 'Live Ops' },
  { href: '/ops/wpl/scorecard', label: 'Scorecard', icon: <FileText className="w-4 h-4" />, group: 'Live Ops' },
  { href: '/ops/wpl/matchday', label: 'Match Day', icon: <Activity className="w-4 h-4" />, group: 'Live Ops' },

  { href: '/ops/wpl/teams', label: 'Teams', icon: <Shield className="w-4 h-4" />, group: 'League Data' },
  { href: '/ops/wpl/players', label: 'Players', icon: <Users className="w-4 h-4" />, group: 'League Data' },
  { href: '/ops/wpl/batting-stats', label: 'Batting Stats', icon: <TrendingUp className="w-4 h-4" />, group: 'League Data' },
  { href: '/ops/wpl/bowling-stats', label: 'Bowling Stats', icon: <TrendingUp className="w-4 h-4" />, group: 'League Data' },
  { href: '/ops/wpl/venues', label: 'Venues', icon: <MapPin className="w-4 h-4" />, group: 'League Data' },

  { href: '/ops/wpl/stories', label: 'Stories', icon: <FileText className="w-4 h-4" />, group: 'Content' },
  { href: '/ops/wpl/predictions', label: 'Predictions', icon: <Target className="w-4 h-4" />, group: 'Content' },
  { href: '/ops/wpl/settings', label: 'Settings', icon: <Settings className="w-4 h-4" />, group: 'System' },
];

export default function WPLAdminSidebarNew() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['Overview', 'Live Ops', 'League Data', 'Content', 'System'])
  );

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return menuItems;
    const q = searchQuery.toLowerCase();
    return menuItems.filter(
      (item) => item.label.toLowerCase().includes(q) || item.group.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const groups = useMemo(() => {
    const list: string[] = [];
    filteredItems.forEach((i) => {
      if (!list.includes(i.group)) list.push(i.group);
    });
    return list;
  }, [filteredItems]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full text-neutral-200 select-none">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-black text-white text-xs tracking-wider shadow-md shadow-purple-500/20">
            WPL
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-white block">
              SportsUp Admin
            </span>
            <span className="text-[10px] text-purple-400 font-mono tracking-wider uppercase block">
              WPL Operations
            </span>
          </div>
        </div>
      </div>

      <div className="px-3 py-2.5 border-b border-white/10 bg-black/20">
        <AdminLeagueSwitcher />
      </div>

      <div className="p-3 border-b border-white/10">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search WPL ops..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {groups.map((group) => {
          const isExpanded = expandedGroups.has(group);
          const items = filteredItems.filter((i) => i.group === group);

          return (
            <div key={group} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup(group)}
                className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider hover:text-white transition"
              >
                <span>{group}</span>
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {isExpanded && (
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/ops/wpl/dashboard' && pathname?.startsWith(item.href));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={
                          "flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors " +
                          (isActive
                            ? "bg-purple-600 text-white font-semibold shadow-md shadow-purple-600/30"
                            : "text-neutral-400 hover:text-white hover:bg-white/5")
                        }
                      >
                        <span className={isActive ? "text-white" : "text-neutral-400"}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-white/10 text-[10px] text-neutral-500 font-mono text-center">
        WPL Ops &bull; v2027.1
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-3.5 left-4 z-50 p-2 rounded-lg bg-[#12171D] border border-white/10 text-white hover:bg-white/10"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={
          "md:hidden fixed top-0 left-0 h-screen z-50 w-72 bg-[#0B0E17] border-r border-white/10 flex flex-col transition-transform duration-300 ease-in-out " +
          (mobileOpen ? "translate-x-0" : "-translate-x-full")
        }
      >
        <SidebarContent />
      </aside>

      <aside className="hidden md:flex sticky top-0 left-0 h-screen z-40 bg-[#0B0E17] border-r border-white/10 flex-col w-64">
        <SidebarContent />
      </aside>
    </>
  );
}
