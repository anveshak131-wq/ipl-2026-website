// Team colors for IPL 2026
export const teamColors: Record<string, string> = {
  'RCB': '#EC1C24',
  'MI': '#004F91',
  'CSK': '#FDB913',
  'KKR': '#3A225D',
  'DC': '#004C93',
  'PBKS': '#ED1B27',
  'RR': '#2D4D9F',
  'SRH': '#F78F1E',
  'GT': '#0C4B2D',
  'LSG': '#FFEDED',
};

// Animation variants
export const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.2 }
  }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// Common styles
export const cardStyle = "rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-slate-600/70 transition-all duration-300";
export const buttonStyle = "px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2";
export const inputStyle = "w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500";

// Role colors
export const roleColors = {
  'Batsman': 'from-orange-500 to-amber-500',
  'Bowler': 'from-blue-500 to-cyan-400',
  'All-Rounder': 'from-purple-500 to-pink-500',
  'Wicket-Keeper': 'from-green-500 to-emerald-400',
  'default': 'from-slate-500 to-slate-400'
};

// Common transitions
export const transition = {
  default: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  spring: { type: 'spring', stiffness: 300, damping: 25 }
};
