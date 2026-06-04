import type { League } from '@/types';

export type LeagueAudience = 'public' | 'admin';

type LeagueDesignTokens = {
  name: string;
  shortName: string;
  surface: string;
  surfaceStrong: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accentSecondary: string;
  accentTertiary: string;
  danger: string;
  warning: string;
  success: string;
  liveGradient: string;
  softGradient: string;
  glow: string;
};

export const leagueDesign: Record<League, Record<LeagueAudience, LeagueDesignTokens>> = {
  ipl: {
    public: {
      name: 'Indian Premier League',
      shortName: 'IPL',
      surface: 'rgba(7, 26, 61, 0.72)',
      surfaceStrong: 'rgba(8, 17, 39, 0.9)',
      border: 'rgba(80, 145, 205, 0.28)',
      text: '#F8FAFC',
      muted: '#B6C7DE',
      accent: '#FFD700',
      accentSecondary: '#5091CD',
      accentTertiary: '#7C3AED',
      danger: '#EF4444',
      warning: '#F59E0B',
      success: '#22C55E',
      liveGradient: 'linear-gradient(135deg, rgba(239,68,68,0.96), rgba(245,158,11,0.92), rgba(255,215,0,0.92))',
      softGradient: 'linear-gradient(135deg, rgba(255,215,0,0.18), rgba(80,145,205,0.12), rgba(124,58,237,0.10))',
      glow: 'rgba(255, 215, 0, 0.26)',
    },
    admin: {
      name: 'IPL Command',
      shortName: 'IPL',
      surface: 'rgba(15, 23, 42, 0.76)',
      surfaceStrong: 'rgba(11, 17, 32, 0.94)',
      border: 'rgba(37, 99, 235, 0.26)',
      text: '#F8FAFC',
      muted: '#94A3B8',
      accent: '#2563EB',
      accentSecondary: '#FFD700',
      accentTertiary: '#38BDF8',
      danger: '#EF4444',
      warning: '#F59E0B',
      success: '#22C55E',
      liveGradient: 'linear-gradient(135deg, rgba(37,99,235,0.95), rgba(56,189,248,0.82))',
      softGradient: 'linear-gradient(135deg, rgba(37,99,235,0.14), rgba(255,215,0,0.08))',
      glow: 'rgba(37, 99, 235, 0.26)',
    },
  },
  wpl: {
    public: {
      name: "Women's Premier League",
      shortName: 'WPL',
      surface: 'rgba(10, 14, 39, 0.72)',
      surfaceStrong: 'rgba(11, 17, 32, 0.9)',
      border: 'rgba(236, 72, 153, 0.28)',
      text: '#FFFFFF',
      muted: '#CBD5E1',
      accent: '#EC4899',
      accentSecondary: '#7C3AED',
      accentTertiary: '#22D3EE',
      danger: '#F43F5E',
      warning: '#FBBF24',
      success: '#10B981',
      liveGradient: 'linear-gradient(135deg, rgba(236,72,153,0.96), rgba(124,58,237,0.92), rgba(34,211,238,0.88))',
      softGradient: 'linear-gradient(135deg, rgba(236,72,153,0.18), rgba(124,58,237,0.14), rgba(34,211,238,0.10))',
      glow: 'rgba(236, 72, 153, 0.28)',
    },
    admin: {
      name: 'WPL Command',
      shortName: 'WPL',
      surface: 'rgba(15, 23, 42, 0.76)',
      surfaceStrong: 'rgba(11, 17, 32, 0.94)',
      border: 'rgba(20, 184, 166, 0.26)',
      text: '#F8FAFC',
      muted: '#A7B8D8',
      accent: '#7C3AED',
      accentSecondary: '#14B8A6',
      accentTertiary: '#EC4899',
      danger: '#F43F5E',
      warning: '#FBBF24',
      success: '#10B981',
      liveGradient: 'linear-gradient(135deg, rgba(124,58,237,0.95), rgba(20,184,166,0.82), rgba(236,72,153,0.72))',
      softGradient: 'linear-gradient(135deg, rgba(124,58,237,0.16), rgba(20,184,166,0.12), rgba(236,72,153,0.08))',
      glow: 'rgba(20, 184, 166, 0.26)',
    },
  },
};

export const motionPresets = {
  panelReveal: {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0 },
  },
  livePulse: {
    scale: [1, 1.08, 1],
    opacity: [0.7, 1, 0.7],
  },
  scoreFlip: {
    initial: { rotateX: -70, opacity: 0 },
    animate: { rotateX: 0, opacity: 1 },
  },
};
