'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Team } from '@/types';
import { getAnimatedLogoPath, getLogoPath } from '@/lib/logoUtils';
import RCBLottie from '@/components/ui/RCBLottie';
import RCBLionLogo from '@/components/RCBLion/RCBLionLogo';
import { Edit, Trash2, Users, Trophy, MapPin, MoreVertical, CheckSquare, Square } from 'lucide-react';

interface ModernTeamCardProps {
    team: Team;
    index: number;
    onEdit: (team: Team) => void;
    onDelete: (teamId: string) => void;
    isSelected?: boolean;
    onSelect?: (teamId: string) => void;
    isSubmitting?: boolean;
}

export default function ModernTeamCard({
    team,
    index,
    onEdit,
    onDelete,
    isSelected = false,
    onSelect,
    isSubmitting = false
}: ModernTeamCardProps) {
    const [showActions, setShowActions] = useState(false);

    const renderTeamLogo = (team: Team, size: number = 80) => {
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
                            const teamLeague = team.league || 'ipl';
                            const animatedPath = getAnimatedLogoPath(team.id, team.shortName || '', teamLeague);
                            (e.target as HTMLImageElement).src = animatedPath;
                        }}
                    />
                );
            }
        }

        const teamLeague = team.league || 'ipl';
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

    const primaryColor = team.colors?.primary || '#6B46C1';
    const secondaryColor = team.colors?.secondary || '#FFD700';
    const leagueBadge = team.league === 'wpl' ? 'WPL' : 'IPL';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className={`relative group bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-2xl border-2 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${
                isSelected 
                    ? 'border-ipl-gold shadow-lg shadow-ipl-gold/20' 
                    : 'border-slate-700/50 hover:border-opacity-100'
            }`}
            style={{
                borderColor: isSelected ? undefined : `${primaryColor}40`
            }}
        >
            {/* Selection Checkbox */}
            {onSelect && (
                <div className="absolute top-4 left-4 z-10">
                    <button
                        onClick={() => onSelect(team.id)}
                        className="p-1 rounded-lg hover:bg-white/10 transition-all"
                    >
                        {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-ipl-gold" />
                        ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                        )}
                    </button>
                </div>
            )}

            {/* League Badge */}
            <div className="absolute top-4 right-4 z-10">
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    team.league === 'wpl' 
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50' 
                        : 'bg-ipl-gold/20 text-ipl-gold border border-ipl-gold/50'
                }`}>
                    {leagueBadge}
                </div>
            </div>

            {/* Card Content */}
            <div className="p-6 pt-16">
                {/* Team Logo */}
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div 
                            className="w-32 h-32 rounded-2xl flex items-center justify-center p-4"
                            style={{
                                background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20)`,
                                border: `2px solid ${primaryColor}40`
                            }}
                        >
                            {renderTeamLogo(team, 96)}
                        </div>
                        {/* Glow effect */}
                        <div 
                            className="absolute inset-0 rounded-2xl blur-xl opacity-30 -z-10"
                            style={{
                                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                            }}
                        />
                    </div>
                </div>

                {/* Team Name */}
                <div className="text-center mb-4">
                    <h3 className="text-2xl font-bold text-white mb-1">{team.name}</h3>
                    <p className="text-sm text-gray-400 font-medium">{team.shortName}</p>
                </div>

                {/* Description */}
                {team.description && (
                    <p className="text-sm text-gray-400 text-center mb-6 line-clamp-2">
                        {team.description}
                    </p>
                )}

                {/* Team Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {team.players && team.players.length > 0 && (
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                            <Users className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                            <div className="text-lg font-bold text-white">{team.players.length}</div>
                            <div className="text-xs text-gray-400">Players</div>
                        </div>
                    )}
                    {team.trophies && team.trophies.length > 0 && (
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                            <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                            <div className="text-lg font-bold text-white">{team.trophies.length}</div>
                            <div className="text-xs text-gray-400">Trophies</div>
                        </div>
                    )}
                    {team.homeGrounds && team.homeGrounds.length > 0 && (
                        <div className="bg-white/5 rounded-lg p-3 text-center col-span-2">
                            <MapPin className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                            <div className="text-sm font-semibold text-white">{team.homeGrounds.length}</div>
                            <div className="text-xs text-gray-400">Home Grounds</div>
                        </div>
                    )}
                </div>

                {/* Team Colors */}
                {team.colors && (
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div 
                            className="w-8 h-8 rounded-full border-2 border-white/20"
                            style={{ backgroundColor: team.colors.primary }}
                            title={`Primary: ${team.colors.primary}`}
                        />
                        {team.colors.secondary && (
                            <div 
                                className="w-8 h-8 rounded-full border-2 border-white/20"
                                style={{ backgroundColor: team.colors.secondary }}
                                title={`Secondary: ${team.colors.secondary}`}
                            />
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-center gap-2 pt-4 border-t border-white/10">
                    <button
                        onClick={() => onEdit(team)}
                        disabled={isSubmitting}
                        className="p-2 text-ipl-gold hover:bg-ipl-gold/10 rounded-lg transition-all duration-200 disabled:opacity-50"
                        title="Edit Team"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(team.id)}
                        disabled={isSubmitting}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 disabled:opacity-50"
                        title="Delete Team"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

