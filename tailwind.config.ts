import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        ipl: {
          'blue-dark': '#1D3D8D',
          'blue-light': '#5091CD',
          'gold': '#FFD700',
          'purple': '#7C3AED',
        },
      },
      animation: {
        'aurora': 'aurora 24s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      keyframes: {
        aurora: {
          '0%': { backgroundPosition: '8% 18%, 78% 32%, 52% 78%' },
          '50%': { backgroundPosition: '12% 22%, 82% 28%, 48% 82%' },
          '100%': { backgroundPosition: '8% 18%, 78% 32%, 52% 78%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        glow: {
          '0%': { opacity: '0.7', filter: 'brightness(1)' },
          '100%': { opacity: '1', filter: 'brightness(1.2)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.98)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
export default config;
