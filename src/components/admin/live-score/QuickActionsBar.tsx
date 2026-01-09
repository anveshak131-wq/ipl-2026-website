'use client';

import { useState } from 'react';
import { 
  Users, 
  RotateCcw, 
  Save, 
  Settings, 
  Download,
  RefreshCw,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickActionsBarProps {
  onChangeBatter: () => void;
  onChangeBowler: () => void;
  onUndo: () => void;
  onSave: () => void;
  onSettings?: () => void;
  onExport?: () => void;
  canUndo: boolean;
  isSaving: boolean;
  isMobile?: boolean;
  league?: 'ipl' | 'wpl';
}

export default function QuickActionsBar({
  onChangeBatter,
  onChangeBowler,
  onUndo,
  onSave,
  onSettings,
  onExport,
  canUndo,
  isSaving,
  isMobile = false,
  league = 'ipl',
}: QuickActionsBarProps) {
  const [isExpanded, setIsExpanded] = useState(!isMobile);

  const leagueColors = {
    ipl: {
      primary: 'bg-blue-600 hover:bg-blue-700',
      secondary: 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30',
      text: 'text-blue-300',
      icon: 'text-blue-400',
    },
    wpl: {
      primary: 'bg-purple-600 hover:bg-purple-700',
      secondary: 'bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/30',
      text: 'text-purple-300',
      icon: 'text-pink-400',
    },
  };

  const colors = leagueColors[league];

  const mainActions = [
    {
      icon: Users,
      label: 'Change Batter',
      onClick: onChangeBatter,
      color: colors.secondary,
    },
    {
      icon: Users,
      label: 'Change Bowler',
      onClick: onChangeBowler,
      color: colors.secondary,
    },
    {
      icon: RotateCcw,
      label: 'Undo',
      onClick: onUndo,
      disabled: !canUndo,
      color: 'bg-gray-600/20 hover:bg-gray-600/30 border-gray-500/30',
    },
    {
      icon: Save,
      label: isSaving ? 'Saving...' : 'Save',
      onClick: onSave,
      disabled: isSaving,
      color: `bg-gradient-to-r ${league === 'ipl' ? 'from-blue-600 to-cyan-600' : 'from-purple-600 to-pink-600'} ${isSaving ? 'animate-pulse' : ''}`,
      primary: true,
    },
  ];

  const extraActions = [
    onSettings && {
      icon: Settings,
      label: 'Settings',
      onClick: onSettings,
      color: colors.secondary,
    },
    onExport && {
      icon: Download,
      label: 'Export',
      onClick: onExport,
      color: colors.secondary,
    },
  ].filter(Boolean);

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-white/10">
        {/* Main Actions - Always Visible */}
        <div className="grid grid-cols-4 gap-2 p-3">
          {mainActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={index}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`
                  flex flex-col items-center justify-center gap-1 p-3 rounded-xl
                  ${action.primary ? action.color : action.color}
                  ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  transition-all active:scale-95
                  ${action.primary ? 'text-white' : 'text-white border'}
                `}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-semibold">{action.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Expandable Extra Actions */}
        {extraActions.length > 0 && (
          <>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full px-4 py-2 flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white transition-colors border-t border-white/10"
            >
              {isExpanded ? (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>Less</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>More Actions</span>
                </>
              )}
            </button>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-2 p-3 border-t border-white/10">
                    {extraActions.map((action: any, index) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={index}
                          onClick={action.onClick}
                          className={`
                            flex items-center justify-center gap-2 p-3 rounded-xl
                            ${action.color} text-white border
                            transition-all active:scale-95
                          `}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-xs font-semibold">{action.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="flex flex-wrap gap-3">
      {mainActions.map((action, index) => {
        const Icon = action.icon;
        return (
          <button
            key={index}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`
              flex items-center gap-2 px-4 py-3 rounded-xl font-bold
              ${action.primary ? action.color : action.color}
              ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}
              transition-all
              ${action.primary ? 'text-white shadow-lg hover:shadow-xl' : 'text-white border'}
            `}
          >
            <Icon className="w-5 h-5" />
            {action.label}
          </button>
        );
      })}
      {extraActions.map((action: any, index) => {
        const Icon = action.icon;
        return (
          <button
            key={index}
            onClick={action.onClick}
            className={`
              flex items-center gap-2 px-4 py-3 rounded-xl font-bold
              ${action.color} text-white border
              transition-all hover:scale-105
            `}
          >
            <Icon className="w-5 h-5" />
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
