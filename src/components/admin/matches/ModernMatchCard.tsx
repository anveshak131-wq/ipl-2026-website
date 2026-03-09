'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Match } from '@/types';
import { getAnimatedLogoPath, getLogoPath } from '@/lib/logoUtils';
import { getMatchNumberDisplay } from '@/lib/matchNumberUtils';
import RCBLottie from '@/components/ui/RCBLottie';
import RCBLionLogo from '@/components/RCBLion/RCBLionLogo';
import { Calendar, Clock, MapPin, Edit, Trash2, CheckCircle2, XCircle, Zap, ExternalLink, Trophy } from 'lucide-react';
import { useLeague } from '@/contexts/LeagueContext';

interface ModernMatchCardProps {
    match: Match;
    index: number;
    onEdit: (match: Match) => void;
    onDelete: (matchId: string) => void;
    onExportCalendar?: (match: Match) => void;
    isSelected?: boolean;
    onSelect?: (matchId: string) => void;
    isSubmitting?: boolean;
    onMarkCompleted?: (matchId: string) => void;
    onMarkCancelled?: (matchId: string) => void;
}

export default function ModernMatchCard({
    match,
    index,
    onEdit,
    onDelete,
    onExportCalendar,
    isSelected = false,
    onSelect,
    isSubmitting = false,
    onMarkCompleted,
    onMarkCancelled
}: ModernMatchCardProps) {
    const { currentLeague } = useLeague();
    const [showActions, setShowActions] = useState(false);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'live':
                return {
                    bg: 'bg-red-500/20',
                    border: 'border-red-500/50',
                    text: 'text-red-400',
                    icon: Zap,
                    label: 'LIVE',
                    pulse: true
                };
            case 'completed':
                return {
                    bg: 'bg-green-500/20',
                    border: 'border-green-500/50',
                    text: 'text-green-400',
                    icon: CheckCircle2,
                    label: 'COMPLETED',
                    pulse: false
                };
            case 'cancelled':
                return {
                    bg: 'bg-gray-500/20',
                    border: 'border-gray-500/50',
                    text: 'text-gray-400',
                    icon: XCircle,
                    label: 'CANCELLED',
                    pulse: false
                };
            default:
                return {
                    bg: 'bg-blue-500/20',
                    border: 'border-blue-500/50',
                    text: 'text-blue-400',
                    icon: Clock,
                    label: 'SCHEDULED',
                    pulse: false
                };
        }
    };

    const renderTeamLogo = (team: Match['team1'] | Match['team2'], size: number = 48) => {
        const teamIdStr = String(team.id || '');
        const isPlaceholderTeam = 
            teamIdStr.includes('tbd-') || 
            teamIdStr === '16' || 
            teamIdStr === '17' || 
            teamIdStr === '18' || 
            teamIdStr === '19' ||
            team.shortName === 'TBD' || 
            team.shortName?.includes('Place') || 
            team.name?.includes('Place Team');

        if (isPlaceholderTeam) {
            return (
                <Image 
                    src="/logos/tba_logo.svg" 
                    alt="TBA" 
                    width={size}
                    height={size}
                    className="object-contain"
                />
            );
        }

        if (team.logo && team.logo.trim() !== '') {
            if (team.logo.includes('tba_logo.svg')) {
                return (
                    <Image 
                        src={team.logo} 
                        alt="TBA" 
                        width={size}
                        height={size}
                        className="object-contain"
                    />
                );
            }
            if (!team.logo.endsWith('.json') && !team.logo.includes('rcb_logo_premium.svg')) {
                return (
                    <Image 
                        src={team.logo} 
                        alt={team.shortName || team.name} 
                        width={size}
                        height={size}
                        className="object-contain"
                        onError={(e) => {
                            const teamLeague = team.league || match.league || 'ipl';
                            const animatedPath = getAnimatedLogoPath(team.id, team.shortName || '', teamLeague);
                            (e.target as HTMLImageElement).src = animatedPath;
                        }}
                    />
                );
            }
        }

        const teamLeague = team.league || match.league || 'ipl';
        const animatedPath = getAnimatedLogoPath(team.id, team.shortName || '', teamLeague);

        if (animatedPath.endsWith('rcb_logo_premium.svg')) {
            return (
                <div className="flex items-center justify-center" style={{ width: size, height: size }}>
                    <RCBLionLogo className="w-full h-full" />
                </div>
            );
        }
        if (animatedPath.endsWith('.json')) {
            return (
                <div className="flex items-center justify-center" style={{ width: size, height: size }}>
                    <RCBLottie className="w-full h-full" />
                </div>
            );
        }
        return (
            <Image 
                src={animatedPath} 
                alt={team.shortName || team.name} 
                width={size}
                height={size}
                className="object-contain"
                onError={(e) => {
                    const fallback = getLogoPath(team.id);
                    (e.target as HTMLImageElement).src = fallback;
                }}
            />
        );
    };

    const statusConfig = getStatusConfig(match.status);
    const StatusIcon = statusConfig.icon;

    const isPlaceholder1 = String(match.team1.id).includes('tbd-') || ['16','17','18','19'].includes(String(match.team1.id)) || match.team1.shortName?.includes('Place') || match.team1.name?.includes('Place Team');
    const isPlaceholder2 = String(match.team2.id).includes('tbd-') || ['16','17','18','19'].includes(String(match.team2.id)) || match.team2.shortName?.includes('Place') || match.team2.name?.includes('Place Team');

    const statusGradients: Record<string, string> = {
        live: 'from-red-600/90 via-rose-500/80 to-orange-500/70',
        completed: 'from-emerald-600/90 via-green-500/80 to-teal-500/70',
        cancelled: 'from-gray-600/90 via-slate-500/80 to-zinc-500/70',
        upcoming: 'from-blue-600/90 via-indigo-500/80 to-violet-500/70',
    };
    const statusGlow: Record<string, string> = {
        live: 'shadow-red-500/30',
        completed: 'shadow-emerald-500/30',
        cancelled: 'shadow-gray-500/20',
        upcoming: 'shadow-blue-500/30',
    };
    const headerGradient = statusGradients[match.status] || statusGradients.upcoming;
    const cardGlow = statusGlow[match.status] || statusGlow.upcoming;

    return (
        <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.045, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -4, scale: 1.02 }}
            className={`relative group overflow-hidden rounded-2xl border transition-all duration-300 shadow-xl ${cardGlow} ${
                isSelected
                    ? 'border-ipl-gold/80 shadow-ipl-gold/25 shadow-2xl'
                    : 'border-white/10 hover:border-white/25 hover:shadow-2xl'
            }`}
            style={{
                background: 'linear-gradient(145deg, rgba(15,20,30,0.95) 0%, rgba(10,12,20,0.98) 100%)',
                backdropFilter: 'blur(20px)',
            }}
        >
            {/* Top gradient header strip */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${headerGradient}`} />

            {/* Ambient background glow */}
            <div className={`absolute inset-0 opacity-5 bg-gradient-to-br ${headerGradient} pointer-events-none`} />

            {/* Selection Checkbox */}
            {onSelect && (
                <div className="absolute top-4 left-4 z-20">
                    <motion.div whileTap={{ scale: 0.9 }}>
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onSelect(match.id)}
                            className="w-5 h-5 rounded border-2 border-white/30 bg-white/10 text-ipl-gold focus:ring-2 focus:ring-ipl-gold/50 cursor-pointer accent-yellow-400"
                        />
                    </motion.div>
                </div>
            )}

            {/* Status Badge */}
            <div className={`absolute top-4 right-4 z-20 ${statusConfig.bg} backdrop-blur-sm ${statusConfig.border} border rounded-full px-3 py-1 flex items-center gap-1.5`}>
                {match.status === 'live' ? (
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                ) : (
                    <StatusIcon className={`w-3.5 h-3.5 ${statusConfig.text}`} />
                )}
                <span className={`text-[10px] font-bold ${statusConfig.text} uppercase tracking-widest`}>
                    {statusConfig.label}
                </span>
            </div>

            {/* Match Number Badge */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                <div className="relative">
                    <div className="bg-gradient-to-r from-yellow-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-yellow-400" />
                        <span className="text-yellow-300">{getMatchNumberDisplay(match, [])}</span>
                    </div>
                </div>
            </div>

            {/* Card Content */}
            <div className="p-5 pt-14 relative z-10">
                {/* Date & Time row */}
                <div className="flex items-center justify-center gap-3 mb-5">
                    <div className="flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1.5 text-xs text-gray-300">
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                        <span>{formatDate(match.date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1.5 text-xs text-gray-300">
                        <Clock className="w-3.5 h-3.5 text-purple-400" />
                        <span>{formatTime(match.time)}</span>
                    </div>
                </div>

                {/* Teams matchup */}
                <div className="flex items-center justify-between gap-2 mb-5">
                    {/* Team 1 */}
                    <motion.div
                        className="flex flex-col items-center gap-2.5 flex-1"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                    >
                        <div className="relative w-16 h-16 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full bg-white/5 ring-1 ring-white/15" />
                            <div className="relative w-14 h-14 flex items-center justify-center drop-shadow-lg">
                                {renderTeamLogo(match.team1, 56)}
                            </div>
                        </div>
                        <span className="text-white font-bold text-base leading-tight text-center">
                            {isPlaceholder1 ? 'TBD' : match.team1.shortName}
                        </span>
                    </motion.div>

                    {/* VS divider */}
                    <div className="relative flex flex-col items-center gap-1 mx-1">
                        <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                        <div className="bg-gradient-to-br from-yellow-500/20 to-purple-600/20 border border-white/15 rounded-full w-9 h-9 flex items-center justify-center shadow-inner">
                            <span className="text-[11px] font-extrabold text-white/80 tracking-wider">VS</span>
                        </div>
                        <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                    </div>

                    {/* Team 2 */}
                    <motion.div
                        className="flex flex-col items-center gap-2.5 flex-1"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                    >
                        <div className="relative w-16 h-16 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full bg-white/5 ring-1 ring-white/15" />
                            <div className="relative w-14 h-14 flex items-center justify-center drop-shadow-lg">
                                {renderTeamLogo(match.team2, 56)}
                            </div>
                        </div>
                        <span className="text-white font-bold text-base leading-tight text-center">
                            {isPlaceholder2 ? 'TBD' : match.team2.shortName}
                        </span>
                    </motion.div>
                </div>

                {/* Venue */}
                <div className="flex items-center justify-center gap-1.5 mb-4 px-2">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    <span className="text-xs text-gray-400 truncate">{match.venue.split(',')[0]}</span>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-3" />

                {/* Actions bar */}
                <div className="flex items-center justify-center gap-1">
                    <button
                        onClick={() => onEdit(match)}
                        disabled={isSubmitting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-yellow-400 hover:bg-yellow-500/15 hover:text-yellow-300 border border-transparent hover:border-yellow-500/30 transition-all duration-200 disabled:opacity-40"
                        title="Edit Match"
                    >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                    </button>
                    {onExportCalendar && (
                        <button
                            onClick={() => onExportCalendar(match)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-400 hover:bg-blue-500/15 hover:text-blue-300 border border-transparent hover:border-blue-500/30 transition-all duration-200"
                            title="Export to Calendar"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {onMarkCompleted && match.status !== 'completed' && (
                        <button
                            onClick={() => onMarkCompleted(match.id)}
                            disabled={isSubmitting}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 hover:bg-emerald-500/15 hover:text-emerald-300 border border-transparent hover:border-emerald-500/30 transition-all duration-200 disabled:opacity-40"
                            title="Mark as Completed"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {onMarkCancelled && match.status !== 'cancelled' && (
                        <button
                            onClick={() => onMarkCancelled(match.id)}
                            disabled={isSubmitting}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-orange-400 hover:bg-orange-500/15 hover:text-orange-300 border border-transparent hover:border-orange-500/30 transition-all duration-200 disabled:opacity-40"
                            title="Mark as Cancelled"
                        >
                            <XCircle className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(match.id)}
                        disabled={isSubmitting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/15 hover:text-red-300 border border-transparent hover:border-red-500/30 transition-all duration-200 disabled:opacity-40"
                        title="Delete Match"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Bottom shimmer line */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </motion.div>
    );
}

