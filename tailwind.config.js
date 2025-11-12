/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ipl-purple': '#6B46C1',
        'ipl-gold': '#FFD700',
        'ipl-dark': '#1a1a2e',
        'ipl-light': '#f8f9fa',
      },
      backgroundImage: {
        'ipl-gradient': 'linear-gradient(135deg, #6B46C1 0%, #FFD700 100%)',
        'ipl-gradient-dark': 'linear-gradient(135deg, #4a2c8a 0%, #ccaa00 100%)',
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'pulse-slow': 'pulse 4s infinite',
      },
    },
  },
  plugins: [],
}

