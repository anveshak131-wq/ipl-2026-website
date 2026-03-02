'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuroraBackground from '@/components/ui/AuroraBackground';
import { api } from '@/lib/data';
import { CustomEmoji } from '@/components/emoji/Emoji';

const IconUserGroup = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const IconTrophy = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
);

const IconChart = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const IconPlay = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const IconPlusCircle = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const IconNewspaper = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
);

const IconCog = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const ArrowTrendingUpIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

interface Stats {
    teamsCount: number;
    matchesCount: number;
    playersCount: number;
    liveMatches: number;
}

interface Activity {
    id: string;
    type: 'match' | 'team' | 'player' | 'content';
    title: string;
    time: string;
    icon: string;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(true);
    const [stats, setStats] = useState<Stats>({
        teamsCount: 0,
        matchesCount: 0,
        playersCount: 0,
        liveMatches: 0
    });
    const [recentActivities] = useState<Activity[]>([
        { id: '1', type: 'match', title: 'Match scheduled: RCB vs MI', time: '2 hours ago', icon: 'cricket' },
        { id: '2', type: 'team', title: 'Team updated: Gujarat Titans', time: '5 hours ago', icon: 'people' },
        { id: '3', type: 'player', title: 'New player added: Virat Kohli', time: '1 day ago', icon: 'star' },
        { id: '4', type: 'content', title: 'News published: IPL 2026 Schedule', time: '2 days ago', icon: '📰' }
    ]);

    useEffect(() => {
        const checkAuth = () => {
            try {
                const token = localStorage.getItem('adminToken');
                if (!token) {
                    router.push('/ipl-admin-2026');
                    return;
                }
                setIsAuthenticated(true);
                fetchStats();
            } catch (error) {
                router.push('/ipl-admin-2026');
            } finally {
                setAuthLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    const fetchStats = async () => {
        try {
            const [teams, matches, players] = await Promise.all([
                api.getTeams(),
                api.getMatches(),
                fetch('/api/players').then(res => res.json())
            ]);

            const liveMatches = matches.filter(m => m.status === 'live').length;

            setStats({
                teamsCount: teams.length,
                matchesCount: matches.length,
                playersCount: Array.isArray(players) ? players.length : 0,
                liveMatches
            });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex min-h-screen bg-[#0B0F13]">
                <AuroraBackground />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-white">Loading...</div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    const kpiCards = [
        {
            id: 'teams',
            title: 'Total Teams',
            value: stats.teamsCount,
            icon: IconUserGroup,
            trend: '+0%',
            trendUp: true,
            gradient: 'from-blue-500/20 to-purple-500/20',
            accentColor: '#2F6FED',
            iconBg: 'bg-blue-500/10',
            iconColor: 'text-blue-400'
        },
        {
            id: 'matches',
            title: 'Total Matches',
            value: stats.matchesCount,
            icon: IconTrophy,
            trend: '+12%',
            trendUp: true,
            gradient: 'from-green-500/20 to-emerald-500/20',
            accentColor: '#10B981',
            iconBg: 'bg-green-500/10',
            iconColor: 'text-green-400'
        },
        {
            id: 'players',
            title: 'Total Players',
            value: stats.playersCount,
            icon: IconChart,
            trend: '+8%',
            trendUp: true,
            gradient: 'from-purple-500/20 to-pink-500/20',
            accentColor: '#A855F7',
            iconBg: 'bg-purple-500/10',
            iconColor: 'text-purple-400'
        },
        {
            id: 'live',
            title: 'Live Matches',
            value: stats.liveMatches,
            icon: IconPlay,
            trend: stats.liveMatches > 0 ? 'LIVE' : 'None',
            trendUp: stats.liveMatches > 0,
            gradient: 'from-red-500/20 to-orange-500/20',
            accentColor: '#EF4444',
            iconBg: 'bg-red-500/10',
            iconColor: 'text-red-400'
        }
    ];

    const quickActions = [
        {
            id: 'add-match',
            title: 'Add Match',
            description: 'Schedule new match',
            icon: IconPlusCircle,
            path: '/ipl-admin-2026/matches',
            gradient: 'from-blue-500/10 to-blue-600/5',
            iconColor: 'text-blue-400'
        },
        {
            id: 'manage-teams',
            title: 'Manage Teams',
            description: 'Add or edit teams',
            icon: IconUserGroup,
            path: '/ipl-admin-2026/teams',
            gradient: 'from-purple-500/10 to-purple-600/5',
            iconColor: 'text-purple-400'
        },
        {
            id: 'add-content',
            title: 'Add Content',
            description: 'Manage banners & news',
            icon: IconNewspaper,
            path: '/ipl-admin-2026/content',
            gradient: 'from-green-500/10 to-green-600/5',
            iconColor: 'text-green-400'
        },
        {
            id: 'settings',
            title: 'Settings',
            description: 'Configure system',
            icon: IconCog,
            path: '/ipl-admin-2026/settings',
            gradient: 'from-gray-500/10 to-gray-600/5',
            iconColor: 'text-gray-400'
        }
    ];

    return (
        <div className="flex min-h-screen bg-[#0B0F13]">
            <AuroraBackground />

            <div className="flex-1 relative z-10">
                <div className="p-8 max-w-[1600px] mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-white mb-2">
                            Dashboard
                        </h1>
                        <p className="text-gray-400">Welcome back! Here's what's happening with your IPL platform.</p>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {kpiCards.map((card) => (
                            <div
                                key={card.id}
                                className="group relative bg-gradient-to-br from-[#12171D] to-[#0B0F13] rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all duration-300 overflow-hidden"
                            >
                                {/* Gradient background on hover */}
                                <div
                                    className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                                />

                                {/* Content */}
                                <div className="relative z-10">
                                    {/* Icon and Trend */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`${card.iconBg} p-3 rounded-xl`}>
                                            <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                                        </div>
                                        <div className={`flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-full ${card.trendUp
                                                ? 'bg-green-500/10 text-green-400'
                                                : 'bg-red-500/10 text-red-400'
                                            }`}>
                                            {card.trendUp && <ArrowTrendingUpIcon className="w-3 h-3" />}
                                            <span>{card.trend}</span>
                                        </div>
                                    </div>

                                    {/* Value */}
                                    <div className="mb-1">
                                        <h3 className="text-4xl font-bold text-white">
                                            {isLoading ? (
                                                <span className="inline-block w-16 h-10 bg-white/5 rounded animate-pulse" />
                                            ) : (
                                                card.value
                                            )}
                                        </h3>
                                    </div>

                                    {/* Label */}
                                    <p className="text-gray-400 text-sm font-medium">{card.title}</p>
                                </div>

                                {/* Accent border bottom */}
                                <div
                                    className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                    style={{ backgroundColor: card.accentColor }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions Section */}
                    <div className="bg-gradient-to-br from-[#12171D] to-[#0B0F13] rounded-2xl p-6 border border-white/5 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-semibold text-white">Quick Actions</h2>
                            <div className="w-12 h-1 bg-gradient-to-r from-[#2F6FED] to-purple-500 rounded-full" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {quickActions.map((action) => (
                                <button
                                    key={action.id}
                                    onClick={() => router.push(action.path)}
                                    className={`group relative bg-gradient-to-br ${action.gradient} hover:from-white/10 hover:to-white/5 rounded-xl p-5 border border-white/5 hover:border-white/10 transition-all duration-300 text-left`}
                                >
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-shrink-0">
                                            <action.icon className={`w-8 h-8 ${action.iconColor} group-hover:scale-110 transition-transform duration-300`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-white font-semibold mb-1 group-hover:text-[#2F6FED] transition-colors">
                                                {action.title}
                                            </h3>
                                            <p className="text-gray-400 text-sm">{action.description}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Recent Activity Timeline */}
                        <div className="bg-gradient-to-br from-[#12171D] to-[#0B0F13] rounded-2xl p-6 border border-white/5">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-semibold text-white">Recent Activity</h2>
                                <ClockIcon className="w-6 h-6 text-gray-400" />
                            </div>

                            <div className="space-y-4">
                            {recentActivities.map((activity) => (
                            <div
                                key={activity.id}
                                className="group relative flex items-start space-x-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 border border-transparent hover:border-white/10"
                            >
                                {/* Timeline dot */}
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#2F6FED]/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                                    {activity.icon === '📰' ? (
                                        <span className="text-lg">{activity.icon}</span>
                                    ) : (
                                        <CustomEmoji type={activity.icon as 'cricket' | 'people' | 'star'} size={20} />
                                    )}
                                </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium mb-1">{activity.title}</p>
                                            <p className="text-gray-400 text-sm">{activity.time}</p>
                                        </div>

                                        {/* Type badge */}
                                        <div className="flex-shrink-0">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 text-gray-300 capitalize">
                                                {activity.type}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* System Status */}
                        <div className="bg-gradient-to-br from-[#12171D] to-[#0B0F13] rounded-2xl p-6 border border-white/5">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-semibold text-white">System Status</h2>
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-green-400 text-sm font-medium">All Systems Operational</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {['Teams API', 'Matches API', 'Players API', 'Content API', 'Settings API'].map((service) => (
                                    <div
                                        key={service}
                                        className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all duration-300"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg shadow-green-500/50" />
                                            <span className="text-white font-medium">{service}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-green-400 text-sm font-medium">Operational</span>
                                            <div className="text-gray-400 text-xs">99.9%</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Performance metrics */}
                            <div className="mt-6 pt-6 border-t border-white/5">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-white mb-1">0.8s</div>
                                        <div className="text-gray-400 text-xs">Avg Response</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-white mb-1">99.9%</div>
                                        <div className="text-gray-400 text-xs">Uptime</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-white mb-1">{stats.matchesCount + stats.playersCount}</div>
                                        <div className="text-gray-400 text-xs">Total Records</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
