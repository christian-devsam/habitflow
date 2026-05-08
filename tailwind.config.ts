import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: 'hsl(var(--bg))',
          card: 'hsl(var(--bg-card))',
          elevated: 'hsl(var(--bg-elevated))',
        },
        border: 'hsl(var(--border))',
        text: {
          DEFAULT: 'hsl(var(--text))',
          muted: 'hsl(var(--text-muted))',
        },
        level: {
          minimum: 'hsl(var(--level-minimum))',
          ideal: 'hsl(var(--level-ideal))',
          elite: 'hsl(var(--level-elite))',
        },
        fund: {
          healthy: '#22c55e',
          warning: '#f59e0b',
          critical: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        glow: {
          from: { boxShadow: '0 0 10px rgba(239, 68, 68, 0.3)' },
          to: { boxShadow: '0 0 25px rgba(239, 68, 68, 0.8), 0 0 50px rgba(239, 68, 68, 0.3)' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
