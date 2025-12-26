'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Match } from '@/types';
import { getAnimatedLogoPath, getLogoPath } from '@/lib/logoUtils';
import { getMatchNumberDisplay } from '@/lib/matchNumberUtils';
import RCBLottie from '@/components/ui/RCBLottie';
import RCBLionLogo from '@/components/RCBLion/RCBLionLogo';
import { Calendar, Clock, MapPin, Edit, Trash2, MoreVertical, CheckCircle2, XCircle, Zap, ExternalLink } from 'lucide-react';
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
        const isPlaceholderTeam = 
            team.id.includes('tbd-') || 
            team.id === '16' || 
            team.id === '17' || 
            team.id === '18' || 
            team.id === '19' ||
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className={`relative group bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-2xl border-2 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${
                isSelected 
                    ? 'border-ipl-gold shadow-lg shadow-ipl-gold/20' 
                    : statusConfig.border + ' border-opacity-50 hover:border-opacity-100'
            }`}
        >
            {/* Selection Checkbox */}
            {onSelect && (
                <div className="absolute top-4 left-4 z-10">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(match.id)}
                        className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 text-ipl-gold focus:ring-2 focus:ring-ipl-gold/50 cursor-pointer"
                    />
                </div>
            )}

            {/* Status Badge */}
            <div className={`absolute top-4 right-4 z-10 ${statusConfig.bg} ${statusConfig.border} border-2 rounded-full px-3 py-1.5 flex items-center gap-2 ${statusConfig.pulse ? 'animate-pulse' : ''}`}>
                <StatusIcon className={`w-4 h-4 ${statusConfig.text}`} />
                <span className={`text-xs font-bold ${statusConfig.text} uppercase tracking-wide`}>
                    {statusConfig.label}
                </span>
            </div>

            {/* Match Number */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-gradient-to-r from-ipl-gold to-ipl-purple text-white text-xs font-bold px-3 py-1 rounded-full">
                    {getMatchNumberDisplay(match, [])}
                </div>
            </div>

            {/* Card Content */}
            <div className="p-6 pt-16">
                {/* Date & Time */}
                <div className="flex items-center justify-center gap-4 mb-6 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(match.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(match.time)}</span>
                    </div>
                </div>

                {/* Teams */}
                <div className="flex items-center justify-between mb-6">
                    {/* Team 1 */}
                    <div className="flex flex-col items-center gap-3 flex-1">
                        <div className="w-16 h-16 flex items-center justify-center">
                            {renderTeamLogo(match.team1, 64)}
                        </div>
                        <div className="text-center">
                            <div className="text-white font-bold text-lg">
                                {(match.team1.id.includes('tbd-') || 
                                  match.team1.id === '16' || 
                                  match.team1.id === '17' || 
                                  match.team1.id === '18' || 
                                  match.team1.id === '19' ||
                                  match.team1.shortName?.includes('Place') || 
                                  match.team1.name?.includes('Place Team')) 
                                    ? 'TBD' 
                                    : match.team1.shortName}
                            </div>
                        </div>
                    </div>

                    {/* VS */}
                    <div className="mx-4 text-gray-500 font-bold text-xl">VS</div>

                    {/* Team 2 */}
                    <div className="flex flex-col items-center gap-3 flex-1">
                        <div className="w-16 h-16 flex items-center justify-center">
                            {renderTeamLogo(match.team2, 64)}
                        </div>
                        <div className="text-center">
                            <div className="text-white font-bold text-lg">
                                {(match.team2.id.includes('tbd-') || 
                                  match.team2.id === '16' || 
                                  match.team2.id === '17' || 
                                  match.team2.id === '18' || 
                                  match.team2.id === '19' ||
                                  match.team2.shortName?.includes('Place') || 
                                  match.team2.name?.includes('Place Team')) 
                                    ? 'TBD' 
                                    : match.team2.shortName}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Venue */}
                <div className="flex items-center justify-center gap-2 mb-4 text-sm text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{match.venue}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center gap-2 pt-4 border-t border-white/10">
                    <button
                        onClick={() => onEdit(match)}
                        disabled={isSubmitting}
                        className="p-2 text-ipl-gold hover:bg-ipl-gold/10 rounded-lg transition-all duration-200 disabled:opacity-50"
                        title="Edit Match"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    {onExportCalendar && (
                        <button
                            onClick={() => onExportCalendar(match)}
                            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-200"
                            title="Export to Calendar"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    )}
                    {onMarkCompleted && match.status !== 'completed' && (
                        <button
                            onClick={() => onMarkCompleted(match.id)}
                            disabled={isSubmitting}
                            className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-all duration-200 disabled:opacity-50"
                            title="Mark as Completed"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                        </button>
                    )}
                    {onMarkCancelled && match.status !== 'cancelled' && (
                        <button
                            onClick={() => onMarkCancelled(match.id)}
                            disabled={isSubmitting}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 disabled:opacity-50"
                            title="Mark as Cancelled"
                        >
                            <XCircle className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(match.id)}
                        disabled={isSubmitting}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 disabled:opacity-50"
                        title="Delete Match"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

